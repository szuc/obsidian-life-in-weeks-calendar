# Life in Weeks Calendar for Obsidian

## Overview

This plugin displays your entire life in a grid of weeks. It color-codes past, present, and future weeks and, more importantly, marks the weeks when you have created a weekly Obsidian note. It integrates with either the Periodic Notes plugin or the Journals plugin, or as a standalone plugin.

## The Life in Weeks Concept

The _Life in Weeks Calendar_ is a visual tool designed to shift one's perspective on time and mortality. It presents a stark, tangible representation of a human lifespan, typically around 90 years, broken down into individual weeks, each represented by a small box. This grid of approximately 4,680 boxes serves as a powerful reminder of the finite nature of life.

At its heart, the life in weeks calendar is a "memento mori," a Latin phrase meaning "remember that you must die." This concept, with roots in Stoic philosophy, encourages individuals to live more intentionally by keeping their mortality at the forefront of their minds. The calendar is not meant to be a morbid or anxiety-inducing tool, but rather a catalyst for positive change.

## Plugin Settings and Options

**Birth Date:**  
Enter your birthday.

**Projected Lifespan:**  
Enter the numbers of years you expect to live.

**Calendar View Mode:**  
Choose how you'd like the calendar displayed, either "Standard" or "Decades" (more details on each of these below).

**View Location:**
Sets which panel a new calendar will be opened in when you use the "Open Life in Weeks Calendar" ribbon button or command palette option.

**Weekly note folder location**

Set the folder where your weekly notes will be stored. Select from existing folders.

- You can create sub-folders within your weekly notes folder using date-based variables in the form of `{{date:format}}`
- Example: Setting your folder as `weekly-notes/{{date:YYYY}}` will organize your notes into yearly sub-folders

**Important performance consideration:** It is strongly recommended to keep your weekly notes in a statically named subfolder rather than directly in your vault root or in a series of dynamically named folders. This improves scanning performance and reduces the number of files the plugin needs to check.

- ❌ Don't use: `/` (the root folder) or `/{{date:YYYY}}` (parallel yearly folders)
- ✓ Do use: `/weekly-notes` (a dedicated folder)

**Weekly note file naming pattern**

Weekly note filenames must resolve to uniquely identifiable weeks (e.g., contain the year and the week number, or contain the year, month, and week start day).

Use [Moment.js date formatting](https://momentjs.com/docs/#/parsing/string-format/) patterns for file names. Common patterns include:

- `gggg-[W]ww` - Year and week number (e.g., `2025-W12`)
- `YYYY-MM-DD` - Year, month, and first date of the week (e.g., `2025-02-28`)
- `DD-MM-YYYY` - First date of the week, month, and year (e.g., `28-02-2025`)

You can also use variable naming format in conjunction with proper moment.js syntax:
- Example: `year-{{date:YYYY}}-week-{{date:ww}}` will resolve to `year-2025-week-23.md`

**First day of the week**
Set the first day of the week. Defaults to Monday.

**Weekly note template**
Choose a file to use as a template for your new weekly notes. Newly created notes will be prefilled with content from this file.

**Periodic Notes Integration:**  
Optionally, this plugin can integrate with the Periodic Notes plugin. With the Periodic Notes plugin installed and the weekly note feature enabled, settings for the folder path, file naming convention, and note templates will come from the Periodic Notes' settings. If you have the standard Calendar plugin installed, Life in Weeks will sync with your selected week start day.

**Journals Plugin Integration:**  
Optionally, this plugin can integrate with the Journals plugin. With the Journals plugin installed and the weekly note feature enabled, settings for the folder path, file naming convention, note templates, and first day of the week will come from the Journals' settings.

Note: most of the date-based custom variables used by Journals for folder paths are supported. Specifically, you can use `{{journal_name}}`, `{{date}}`, `{{start_date}}`, `{{end_date}}`, `{{index}}`, `{{current_date}}` in your folder path or file names.

## Calendar Modes

### Standard View

![standard view screenshot](./assets/life_in_weeks-basic.png)

Displays your life in a grid with each cell representing a week in your life. Each week you've been alive is filled in. Each row is fifty weeks long representing a year in your life. This view mode is responsive and collapses to shorter row lengths in smaller screens or sidebar panels. This is the traditional view for a life in weeks style calendar.

### Decades View

![decades view screenshot](./assets/life_in_weeks-yearly.png)

This view corrects an over simplification in the basic view. Years actually have fifty-two weeks and one day, and depending on the year, will have either fifty-two or fifty-three week start dates. This view accounts for these variations and corrects varying year lengths. Each row accurately reflects a year, and decades of your life are grouped for easier visual parsing. Because row lengths are strictly accurate, this view is not responsive and is only practical for use in the main Obsidian view area.

## Credits

Built on functionality from [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes), [Calendar](https://github.com/liamcain/obsidian-calendar-plugin/tree/master), and [Journal](https://github.com/srg-kostyrko/obsidian-journal).

## Thank You 🙏

If you like this plugin, a coffee is always appreciated!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/szuc)
