package com.auramind.app.wear

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GradeQueueTest {

    private fun grade(id: String, ts: Long = 1L) = GradeResult("s1", id, 2, ts)

    @Test
    fun `json round-trips a grade`() {
        val g = grade("c1", 12345L)
        assertEquals(g, GradeQueueLogic.fromJson(GradeQueueLogic.toJson(g)))
    }

    @Test
    fun `append keeps order`() {
        val (q1, dropped) = GradeQueueLogic.append(JSONArray(), grade("c1"))
        val (q2, _) = GradeQueueLogic.append(q1, grade("c2"))
        assertEquals("c1", q2.getJSONObject(0).getString("cardId"))
        assertEquals("c2", q2.getJSONObject(1).getString("cardId"))
        assertFalse(dropped)
    }

    @Test
    fun `append is bounded at MAX and drops the oldest`() {
        var queue = JSONArray()
        for (i in 0 until GradeQueueLogic.MAX) {
            val (q, _) = GradeQueueLogic.append(queue, grade("c$i"))
            queue = q
        }
        assertEquals(GradeQueueLogic.MAX, GradeQueueLogic.size(queue))
        val (next, dropped) = GradeQueueLogic.append(queue, grade("overflow"))
        assertTrue(dropped)
        assertEquals(GradeQueueLogic.MAX, GradeQueueLogic.size(next))
        // c0 was dropped, overflow appended last
        assertEquals("c1", next.getJSONObject(0).getString("cardId"))
        assertEquals("overflow", next.getJSONObject(GradeQueueLogic.MAX - 1).getString("cardId"))
    }

    @Test
    fun `size reflects queue length`() {
        val (q1, _) = GradeQueueLogic.append(JSONArray(), grade("c1"))
        val (q2, _) = GradeQueueLogic.append(q1, grade("c2"))
        assertEquals(2, GradeQueueLogic.size(q2))
    }
}