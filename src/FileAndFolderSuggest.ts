import { App, AbstractInputSuggest, TFolder, TFile } from 'obsidian';

/**
 * Abstract base class for providing autocomplete suggestions for files and folders.
 * Extends Obsidian's AbstractInputSuggest to provide a reusable suggestion UI.
 * Subclasses must implement getAllFilesAndFolders() to determine which paths to suggest.
 */
abstract class FilesAndFoldersSuggest extends AbstractInputSuggest<string> {
	protected filesAndFolders: string[];
	protected inputEl: HTMLInputElement;
	private static readonly MAX_SUGGESTIONS = 20; // Arbitrary limit to avoid overwhelming the user

	// The filesAndFolders list is populated in the constructor and used for suggestions
	// It isn't refreshed dynamically, so changes in the vault after instantiation won't be reflected
	// without closing and reopening the settings tab. But modifying notes and folders with the settings
	// modal open isn't possible directly from Obsidian.
	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.filesAndFolders = this.getAllFilesAndFolders();
	}

	getSuggestions(inputStr: string): string[] {
		const inputLower = inputStr.toLowerCase();
		const results = this.filesAndFolders.filter((item) =>
			item.toLowerCase().includes(inputLower),
		);
		return results.slice(0, FilesAndFoldersSuggest.MAX_SUGGESTIONS);
	}

	renderSuggestion(item: string, el: HTMLElement): void {
		el.createEl('div', { text: item });
	}

	override selectSuggestion(item: string): void {
		this.inputEl.value = item;
		this.inputEl.dispatchEvent(new Event('input')); // Trigger input event for settings to update
		this.close();
	}

	/**
	 * Abstract method to retrieve all available file or folder paths.
	 * Must be implemented by subclasses to provide specific path types.
	 * @returns Array of file or folder paths to suggest
	 */
	abstract getAllFilesAndFolders(): string[];
}

/**
 * Provides autocomplete suggestions for files in the vault.
 * Retrieves all markdown and other file paths from the vault and presents them
 * as suggestions in an input field.
 */
export class FileSuggest extends FilesAndFoldersSuggest {
	/**
	 * Retrieves all file paths from the vault.
	 * @returns Sorted array of all file paths in the vault
	 */
	getAllFilesAndFolders(): string[] {
		return this.app.vault
			.getFiles()
			.map((file: TFile) => file.path)
			.sort((a, b) => a.localeCompare(b));
	}
}

/**
 * Provides autocomplete suggestions for folders in the vault.
 * Retrieves all folder paths from the vault, including the root folder ('/'),
 * and presents them as suggestions in an input field.
 */
export class FolderSuggest extends FilesAndFoldersSuggest {
	/**
	 * Retrieves all folder paths from the vault, including the root folder.
	 * @returns Sorted array of all folder paths, with '/' representing the vault root
	 */
	getAllFilesAndFolders(): string[] {
		const paths = this.app.vault
			.getAllFolders()
			.map((folder: TFolder) => folder.path)
			.sort((a, b) => a.localeCompare(b));
		return ['/', ...paths];
	}
}
