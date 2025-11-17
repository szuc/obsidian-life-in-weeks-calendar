# Life in Weeks Calendar for Obsidian

## Overview

This plugin displays your entire life in a grid of weeks. It color-codes past, present, and future weeks and, more importantly, marks the weeks when you have created a weekly Obsidian note.

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
Sets which panel a new calendar will be opened in when you use the "Open Life in Weeks Calendar" ribbon button or command pallet option.

**Periodic Notes Integration:**  
Optionally, this plugin can integrate with the Periodic Notes plugin. With the Periodic Notes plugin installed and the weekly note feature enabled, settings for the folder path, file naming convention, and note templates will come from the Periodic Notes' settings. If you have the standard Calendar plugin installed, Life in Weeks will sync with your selected week start day.

**Weekly note folder location**
Set the folder where your weekly notes will be stored. Select from existing folders.

**Weekly note file naming pattern**
Use [Moment.js date formatting](https://momentjs.com/docs/#/parsing/string-format/) patterns for file names. Common patterns include:

- `gggg-[W]ww` names files with year and week number (e.g. 2025-W12).
- `YYYY-MM-DD` names the file with the year, month, and first date of the week (e.g 2025-02-28).
- `DD-MM-YYYY` names the file with the first date of the week, month, and year (e.g. 28-02-2025).

**First day of the week**
Set the first day of the week. Defaults to Monday.

**Weekly note template**
Choose a file to use as a template for your new weekly notes. Newly created notes will be prefilled with content from this file.

## Calendar Modes

### Standard View

![Logo](./assets/life_in_weeks-basic.png)

Displays your life in a grid with each cell representing a week in your life. Each week you've been alive is filled in. Each row is fifty weeks long representing a year in your life. This view mode is responsive and collapses to shorted row lengths in smaller screens or sidebar panels. This is the traditional view for a life in weeks style calendar.

### Decades View

![Logo](./assets/life_in_weeks-yearly.png)

This view corrects an over simplification in the basic view. Years actually have fifty-two weeks and one day in a year, and depending on the year, will have either fifty-two or fifty-three week start dates. This view accounts for these variations and corrects varying year lengths. Each row accurately reflects a year, and decades of your life are grouped for easier visual parsing. Because row lengths are strictly accurate, this view is not responsive and is only practical for use in the main Obsidian view area.

## Credits

Built on functionality from [Periodic Notes](https://github.com/liamcain/obsidian-periodic-notes), [Calendar](https://github.com/liamcain/obsidian-calendar-plugin/tree/master), and [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface).

## Thank You 🙏

If you like this plugin, a coffee is always appreciated!

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/szuc)
