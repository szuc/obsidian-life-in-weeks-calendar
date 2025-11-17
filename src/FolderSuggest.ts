import { App, AbstractInputSuggest, TFolder } from 'obsidian';

export class FolderSuggest extends AbstractInputSuggest<string> {
	private filesAndFolders: string[];
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.filesAndFolders = this.getAllFolders();
	}

	getSuggestions(inputStr: string): string[] {
		const inputLower = inputStr.toLowerCase();
		return this.filesAndFolders.filter((item) =>
			item.toLowerCase().includes(inputLower),
		);
	}

	renderSuggestion(item: string, el: HTMLElement): void {
		el.createEl('div', { text: item });
	}

	override selectSuggestion(item: string): void {
		this.inputEl.value = item;
		this.inputEl.dispatchEvent(new Event('input')); // Trigger input event for settings to update
		this.close();
	}

	private getAllFolders(): string[] {
		const paths: string[] = ['/']; // Include vault root
		this.app.vault
			.getAllFolders()
			.forEach((folder: TFolder) => paths.push(folder.path));
		return paths.sort((a, b) => a.localeCompare(b));
	}
}
