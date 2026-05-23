# Mobile UI Optimization Skill

This skill provides instructions for optimizing React and Tailwind CSS components for mobile devices. When instructed to optimize a UI for mobile, follow these guidelines:

## 1. Responsive Layouts & Flex Wrapping
- Avoid fixed widths that break on small screens. Use `flex-1`, `w-full`, or `max-w-full`.
- When using Flexbox (`flex`) for horizontal rows, always add `flex-wrap` if the elements might exceed the screen width on mobile devices.
- Use Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`) to change `flex-col` on mobile to `flex-row` on larger screens. Example: `flex flex-col md:flex-row`.

## 2. Optimizing Data Tables
- **Never squish data tables:** Financial or data-heavy tables should retain their structure.
- Wrap the `<table />` in a container with `overflow-x-auto` to allow horizontal scrolling.
- **Sticky Columns:** To prevent the user from losing context while scrolling horizontally, make the first identifying column (e.g., Ticker or Name) sticky to the left.
  - Example `th` class: `sticky left-0 z-20 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]`
  - Example `td` class: `sticky left-0 z-10 bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)] group-hover:bg-slate-800`

## 3. Touch Targets & Spacing
- Ensure all interactive elements (buttons, selects, inputs) have sufficient padding (e.g., `py-2.5 px-4`) to serve as comfortable touch targets for fingers.
- Space out stacked elements on mobile using `gap-3` or `gap-4`.

## 4. Typography
- Scale text appropriately. Use `text-sm` or `text-xs` on mobile to save space, but avoid going smaller than `text-[10px]` for readability.
- Use breakpoints to increase text size on desktop: `text-xl sm:text-2xl md:text-3xl`.

Execute these principles rigorously whenever working on the React dashboard in this project.
