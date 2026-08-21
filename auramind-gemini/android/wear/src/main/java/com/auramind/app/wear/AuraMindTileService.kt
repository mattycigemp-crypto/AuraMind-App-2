package com.auramind.app.wear

import androidx.wear.tiles.ActionBuilders
import androidx.wear.tiles.DimensionBuilders
import androidx.wear.tiles.LayoutElementBuilders
import androidx.wear.tiles.ModifiersBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import androidx.wear.tiles.TimelineBuilders
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

/**
 * Wear Tile: due-count + streak glance. Tap launches the review activity.
 */
class AuraMindTileService : TileService() {

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest,
    ): ListenableFuture<TileBuilders.Tile> {
        val payload = WearState.payload.value
        val due = payload?.dueCount ?: 0
        val streak = payload?.streak ?: 0

        val dueText = LayoutElementBuilders.Text.Builder()
            .setText(if (due == 0) "Done!" else "$due due")
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.sp(32f))
                    .build(),
            )
            .build()

        val streakText = LayoutElementBuilders.Text.Builder()
            .setText("$streak-day streak")
            .setFontStyle(
                LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.sp(14f))
                    .build(),
            )
            .build()

        val clickable = ModifiersBuilders.Clickable.Builder()
            .setId("open_review")
            .setOnClick(
                ActionBuilders.LaunchAction.Builder()
                    .setAndroidActivity(
                        ActionBuilders.AndroidActivity.Builder()
                            .setPackageName(packageName)
                            .setClassName("$packageName.MainActivity")
                            .build(),
                    )
                    .build(),
            )
            .build()

        val root = LayoutElementBuilders.Box.Builder()
            .setModifiers(ModifiersBuilders.Modifiers.Builder().setClickable(clickable).build())
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(dueText)
            .addContent(streakText)
            .build()

        val layout = LayoutElementBuilders.Layout.Builder().setRoot(root).build()

        val timeline = TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(
                TimelineBuilders.TimelineEntry.Builder()
                    .setLayout(layout)
                    .build(),
            )
            .build()

        return Futures.immediateFuture(
            TileBuilders.Tile.Builder()
                .setResourcesVersion("1")
                .setTimeline(timeline)
                .build(),
        )
    }
}