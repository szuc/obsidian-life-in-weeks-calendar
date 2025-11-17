import { App, AbstractInputSuggest, TFile } from 'obsidian';

export class FileSuggest extends AbstractInputSuggest<string> {
	private filesAndFolders: string[];
	private inputEl: HTMLInputElement;

	constructor(app: App, inputEl: HTMLInputElement) {
		super(app, inputEl);
		this.inputEl = inputEl;
		this.filesAndFolders = this.getAllFiles();
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

	private getAllFiles(): string[] {
		const paths: string[] = [];
		this.app.vault
			.getFiles()
			.forEach((file: TFile) => paths.push(file.path));
		return paths.sort((a, b) => a.localeCompare(b));
	}
}
