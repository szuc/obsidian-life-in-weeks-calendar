/**
 * Birthday notification feature
 * Manages status bar birthday message display
 */

import type { Plugin } from 'obsidian';
import { createLocalDateYYYYMMDD, dateToYYYYMMDD } from './utils';

/**
 * Manages birthday notifications in the status bar.
 * Tracks whether today's birthday check has already been performed.
 */
export class BirthdayManager {
	private lastBirthdayCheck: string | null = null;
	private statusBarItem: HTMLElement | null = null;

	constructor(private plugin: Plugin) {}

	/**
	 * Checks if today is the user's birthday and displays a message if it is.
	 * Only checks once per day to avoid redundant processing.
	 * Also handles clearing the message on a new day.
	 * @param birthdate - User's birthdate in YYYY-MM-DD format
	 */
	checkAndShow(birthdate: string): void {
		const today = new Date();
		const todayString = dateToYYYYMMDD(today);

		// Skip if already checked today
		if (this.lastBirthdayCheck === todayString) return;

		// Update cache
		this.lastBirthdayCheck = todayString;

		// Clear any existing birthday status bar
		this.cleanup();

		// Check if today is birthday
		const birthDate = createLocalDateYYYYMMDD(birthdate);
		if (
			birthDate.getDate() === today.getDate() &&
			birthDate.getMonth() === today.getMonth()
		) {
			this.statusBarItem = this.plugin.addStatusBarItem();
			this.statusBarItem.createEl('span', { text: 'Happy birthday 🎂' });
		}
	}

	/**
	 * Cleans up the status bar item.
	 * Should be called on plugin unload.
	 */
	cleanup(): void {
		if (this.statusBarItem) {
			this.statusBarItem.remove();
			this.statusBarItem = null;
		}
	}
}
