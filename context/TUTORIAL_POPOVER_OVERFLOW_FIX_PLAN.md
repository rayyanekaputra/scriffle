# 🛠️ Implementation Plan: Tutorial Popover Instructions Text Overflow Fix

## 1. Problem Diagnosis & Root Cause
In [`src/components/tutorial/TutorialMissionsPopover.tsx`](file:///home/moke/Projects/scriffle/src/components/tutorial/TutorialMissionsPopover.tsx), when a mission is active, its instructions callout box renders:
```tsx
<div className="mt-2.5 rounded-xl border p-2.5 text-xs leading-relaxed flex items-start gap-2 ...">
  <MingIcon name="lightbulb_line" size={15} className="shrink-0 mt-0.5 text-amber-500" />
  <div>
    <span className="font-bold block mb-0.5 text-[10px]">Instructions</span>
    <span className="text-[11px] leading-normal">{mission.detailHint}</span>
  </div>
</div>
```

### Key Issues:
1. **Unconstrained Inner Flex Child**: The inner `<div>` wrapper around the "Instructions" label and `detailHint` text lacks `min-w-0` and `flex-1`. In flexbox, flex children without `min-w-0` have an initial `min-width: auto`, preventing them from shrinking narrower than their content.
2. **Missing Word Wrap / Break Rules**: `mission.detailHint` contains punctuation, long phrases, and quotes (e.g. `Click [+] on the upper Emerald "True" handle...`) which can overflow the horizontal popover boundaries without `break-words whitespace-normal text-pretty`.
3. **Card Container Boundaries**: The parent mission card and popover container need explicit containment (`overflow-hidden`, `min-w-0`, `w-full`) to prevent any child element from protruding outside the modal borders.

---

## 2. Proposed Changes

### A. Fix [`TutorialMissionsPopover.tsx`](file:///home/moke/Projects/scriffle/src/components/tutorial/TutorialMissionsPopover.tsx)
* **File**: [`src/components/tutorial/TutorialMissionsPopover.tsx`](file:///home/moke/Projects/scriffle/src/components/tutorial/TutorialMissionsPopover.tsx)
* **Changes**:
  1. Add `w-full min-w-0 overflow-hidden` to the Instructions callout container.
  2. Add `flex-1 min-w-0` to the text content container.
  3. Format the instructions text with `text-[11px] leading-relaxed break-words whitespace-normal text-pretty` inside a semantic paragraph tag `<p>`.
  4. Ensure the mission card row wrapper `flex items-start gap-2.5` has `min-w-0` and the text wrapper `flex-1 min-w-0` strictly clamps child width.

### B. Fix [`MissionStepItem.tsx`](file:///home/moke/Projects/scriffle/src/components/tutorial/MissionStepItem.tsx) (Shared / Reusable Mission Item)
* **File**: [`src/components/tutorial/MissionStepItem.tsx`](file:///home/moke/Projects/scriffle/src/components/tutorial/MissionStepItem.tsx)
* **Changes**:
  1. Add `w-full min-w-0 overflow-hidden` to the active hint box.
  2. Wrap the hint content in `flex-1 min-w-0` with `break-words whitespace-normal leading-relaxed text-[11px]`.

### C. Verify [`TourCardPopover.tsx`](file:///home/moke/Projects/scriffle/src/components/onboarding/TourCardPopover.tsx) & Viewport Bounds
* **File**: [`src/components/onboarding/TourCardPopover.tsx`](file:///home/moke/Projects/scriffle/src/components/onboarding/TourCardPopover.tsx)
* **Changes**:
  1. Audit description and body text wrappers to ensure `break-words` and `min-w-0` are uniformly applied.

---

## 3. Verification & Testing Plan

1. **Automated Unit Tests**:
   - Run `bun test src/__tests__/unit/tutorialPopover.test.ts` and full test suite (`bun test`) to ensure no regressions in mission logic, baseline resets, or theme tokens.
2. **Visual & Responsive Verification**:
   - Verify popover layout on both standard width (`w-[380px]`) and narrow viewport conditions (`max-w-[calc(100vw-32px)]`).
   - Switch between **Light**, **Mono (warm paper)**, **Dark**, and **Custom** themes to verify contrast and visual boundary clipping.
   - Test expanding each of the 6 missions (Missions 01 through 06) to ensure long instructions text wraps cleanly inside the lightbulb callout without horizontal overflow.
