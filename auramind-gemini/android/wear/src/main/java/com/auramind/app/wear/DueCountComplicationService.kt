package com.auramind.app.wear

import androidx.wear.watchface.complications.data.ComplicationData
import androidx.wear.watchface.complications.data.ComplicationType
import androidx.wear.watchface.complications.data.PlainComplicationText
import androidx.wear.watchface.complications.data.ShortTextComplicationData
import androidx.wear.watchface.complications.datasource.ComplicationRequest
import androidx.wear.watchface.complications.datasource.SuspendingComplicationDataSourceService

/**
 * Watch-face complication: shows today's due count, refreshed from the last
 * payload the phone pushed.
 */
class DueCountComplicationService : SuspendingComplicationDataSourceService() {

    override suspend fun onComplicationRequest(
        request: ComplicationRequest,
    ): ComplicationData? {
        val due = WearState.payload.value?.dueCount ?: 0
        return ShortTextComplicationData.Builder(
            PlainComplicationText.Builder(if (due == 0) "Done!" else "$due due").build(),
            PlainComplicationText.Builder("AuraMind").build(),
        ).build()
    }

    override fun getPreviewData(type: ComplicationType): ComplicationData? =
        ShortTextComplicationData.Builder(
            PlainComplicationText.Builder("3 due").build(),
            PlainComplicationText.Builder("AuraMind").build(),
        ).build()
}