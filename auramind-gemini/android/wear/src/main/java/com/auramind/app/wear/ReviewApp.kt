package com.auramind.app.wear

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text

/**
 * Wear-native review flow (glance-first, not a scaled-down phone screen):
 * home hero (due count + streak) → card front → reveal back → grade.
 * Only the flashcard semantics are identical to the phone app.
 */
@Composable
fun ReviewApp() {
    val payload by WearState.payload.collectAsState()
    val context = LocalContext.current

    val p = payload
    if (p == null) {
        IdleScreen()
        return
    }
    if (p.cards.isEmpty()) {
        AllCaughtUp(streak = p.streak)
        return
    }

    // Review state is tracked by cardId, NOT keyed on the payload object: the
    // phone pushes a refreshed payload after every grade, so keying state on
    // the payload would bounce the user back to Home mid-review.
    var started by remember { mutableStateOf(false) }
    var currentCardId by remember { mutableStateOf<String?>(null) }
    var showBack by remember { mutableStateOf(false) }
    var finished by remember { mutableStateOf(false) }

    // Reconcile with payload refreshes: keep the current card when it still
    // exists; advance to the first available card when it was just graded and
    // removed; start fresh when a new payload arrives after completion.
    LaunchedEffect(p) {
        if (finished) {
            if (p.cards.isNotEmpty()) {
                finished = false
                started = false
                currentCardId = null
            }
        } else {
            val stillThere = p.cards.any { it.cardId == currentCardId }
            if (!stillThere) {
                currentCardId = p.cards.firstOrNull()?.cardId
                showBack = false
            }
        }
    }

    if (!started) {
        HomeScreen(dueCount = p.dueCount, streak = p.streak, onStart = {
            started = true
            if (currentCardId == null) currentCardId = p.cards.firstOrNull()?.cardId
        })
        return
    }

    val card = p.cards.firstOrNull { it.cardId == currentCardId }
    if (finished || card == null) {
        AllCaughtUp(streak = p.streak)
        return
    }

    val grade = { rating: Int ->
        val g = GradeResult(p.sessionId, card.cardId, rating, System.currentTimeMillis())
        GradeQueue.enqueue(context, g)
        Thread { GradeQueue.flush(context) }.start()
        val idx = p.cards.indexOfFirst { it.cardId == currentCardId }
        val next = p.cards.getOrNull(idx + 1)
        if (next != null) {
            currentCardId = next.cardId
            showBack = false
        } else {
            finished = true
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = if (showBack) card.back else card.front,
            color = MaterialTheme.colors.onBackground,
            fontSize = 18.sp,
            textAlign = TextAlign.Center,
        )
        Button(
            onClick = { showBack = !showBack },
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
        ) {
            Text(if (showBack) "Back to question" else "Reveal answer")
        }
        if (showBack) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                GradeButton("Again", Modifier.weight(1f)) { grade(0) }
                GradeButton("Hard", Modifier.weight(1f)) { grade(1) }
            }
            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                GradeButton("Good", Modifier.weight(1f)) { grade(2) }
                GradeButton("Easy", Modifier.weight(1f)) { grade(3) }
            }
        }
    }
}

@Composable
private fun GradeButton(label: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(modifier = modifier.padding(horizontal = 2.dp), onClick = onClick) {
        Text(label, fontSize = 11.sp)
    }
}

@Composable
private fun HomeScreen(dueCount: Int, streak: Int, onStart: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = dueCount.toString(),
            color = MaterialTheme.colors.primary,
            fontSize = 44.sp,
        )
        Text(
            text = if (dueCount == 1) "card due today" else "cards due today",
            fontSize = 14.sp,
            color = MaterialTheme.colors.onBackground,
            textAlign = TextAlign.Center,
        )
        Text(
            text = "$streak-day streak",
            fontSize = 13.sp,
            color = MaterialTheme.colors.onBackground,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp),
        )
        Button(
            onClick = onStart,
            modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
        ) {
            Text("Start review")
        }
    }
}

@Composable
private fun AllCaughtUp(streak: Int) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text("✨", fontSize = 32.sp)
        Text(
            text = "All caught up",
            fontSize = 20.sp,
            color = MaterialTheme.colors.onBackground,
            textAlign = TextAlign.Center,
        )
        Text(
            text = "$streak-day streak",
            fontSize = 13.sp,
            color = MaterialTheme.colors.onBackground,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun IdleScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colors.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            text = "Open AuraMind on your phone to sync your cards",
            fontSize = 14.sp,
            color = MaterialTheme.colors.onBackground,
            textAlign = TextAlign.Center,
        )
    }
}