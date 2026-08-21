package com.auramind.app.wear

import android.content.Context
import com.google.android.gms.tasks.Tasks
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Pure JSON helpers — unit-testable without Android.
 */
object GradeQueueLogic {
    const val MAX = 200

    fun toJson(g: GradeResult): JSONObject = JSONObject()
        .put("sessionId", g.sessionId)
        .put("cardId", g.cardId)
        .put("rating", g.rating)
        .put("timestamp", g.timestamp)

    fun fromJson(o: JSONObject): GradeResult = GradeResult(
        sessionId = o.getString("sessionId"),
        cardId = o.getString("cardId"),
        rating = o.getInt("rating"),
        timestamp = o.getLong("timestamp"),
    )

    /**
     * Appends a grade. When at capacity, drops the OLDEST entry and reports it
     * so the caller can flag overflow. Returns the new queue and drop flag.
     */
    fun append(current: JSONArray, grade: GradeResult): Pair<JSONArray, Boolean> {
        val out = JSONArray()
        var dropped = false
        var start = 0
        if (current.length() >= MAX) {
            start = 1
            dropped = true
        }
        for (i in start until current.length()) out.put(current.get(i))
        out.put(toJson(grade))
        return out to dropped
    }

    fun size(arr: JSONArray): Int = arr.length()
}

/**
 * Bounded, persisted queue of grades awaiting delivery to the phone. Flushes
 * oldest-first and keeps only entries whose send failed (call on a background
 * thread — Tasks.await blocks).
 */
object GradeQueue {
    private const val PREFS = "auramind_wear_grade_queue"
    private const val KEY_QUEUE = "queue"
    private const val KEY_OVERFLOWED = "overflowed"
    private const val SEND_TIMEOUT_SECONDS = 5L

    fun enqueue(context: Context, grade: GradeResult) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val current = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
        val (next, dropped) = GradeQueueLogic.append(current, grade)
        prefs.edit().putString(KEY_QUEUE, next.toString()).apply()
        if (dropped) prefs.edit().putBoolean(KEY_OVERFLOWED, true).apply()
    }

    /** Attempts delivery of every queued grade; keeps the ones that failed. */
    fun flush(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val arr = JSONArray(prefs.getString(KEY_QUEUE, "[]"))
        if (arr.length() == 0) return 0
        var sent = 0
        val remaining = JSONArray()
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            try {
                val grade = GradeQueueLogic.fromJson(obj)
                Tasks.await(sendGrade(context, grade), SEND_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                sent++
            } catch (t: Throwable) {
                remaining.put(obj)
            }
        }
        prefs.edit().putString(KEY_QUEUE, remaining.toString()).apply()
        return sent
    }

    fun size(context: Context): Int =
        GradeQueueLogic.size(JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_QUEUE, "[]")))

    fun overflowed(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_OVERFLOWED, false)
}