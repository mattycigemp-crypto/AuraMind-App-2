package com.auramind.app.wear

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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

    var started by remember(p) { mutableStateOf(false) }
    var index by remember(p) { mutableIntStateOf(0) }
    var showBack by remember(p) { mutableStateOf(false) }
    var finished by remember(p) { mutableStateOf(false) }

    if (!started) {
        HomeScreen(dueCount = p.dueCount, streak = p.streak, onStart = { started = true })
        return
    }

    val card = p.cards.getOrNull(index)
    if (finished || card == null) {
        AllCaughtUp(streak = p.streak)
        return
    }

    val grade = { rating: Int ->
        val g = GradeResult(p.sessionId, card.cardId, rating, System.currentTimeMillis())
        GradeQueue.enqueue(context, g)
        Thread { GradeQueue.flush(context) }.start()
        if (index + 1 >= p.cards.size) {
            finished = true
        } else {
            index += 1
            showBack = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
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
        modifier = Modifier.fillMaxSize().padding(16.dp),
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
        modifier = Modifier.fillMaxSize().padding(16.dp),
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
        modifier = Modifier.fillMaxSize().padding(16.dp),
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