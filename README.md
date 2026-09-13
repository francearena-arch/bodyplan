# BodyPlan 2.0 Beta 7

Focused heatmap UX release.

## Changes
- Front/back anatomy is now switched via a compact segmented control; only one view is shown at a time.
- Baked-in external anatomy labels are removed from the visible asset area to prevent front/back label collisions.
- Heatmap intensity uses a clearer four-level scale with stronger visual contrast.
- Muscle load rows show both an understandable category and the relative percentage.
- Thresholds are explicit: Low 1–24%, Moderate 25–49%, High 50–74%, Very high 75–100%.
- Calculation details remain collapsed by default.
- Existing local BodyPlan data/storage is unchanged.

## Update
Replace the repository files with this release. The service-worker cache is versioned as `bodyplan-2-beta7` so old cached application assets are retired after activation.
