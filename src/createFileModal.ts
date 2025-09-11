import { App, Modal, Setting } from 'obsidian';

export class CreateFileModal extends Modal {
	message: string;
	cb: () => void;
	constructor(app: App, message: string, cb: () => void) {
		super(app);
		this.message = message;
		this.cb = cb;
		this.setTitle('Create new weekly note');
	}

	override onOpen() {
		const { contentEl } = this;
		contentEl.textContent = this.message;
		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText('Create');
				btn.setCta();
				btn.onClick(() => {
					this.cb();
					this.close();
				});
			})
			.addButton((btn) => {
				btn.setButtonText('Cancel');
				btn.onClick(() => {
					this.close();
				});
			});
	}

	override onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
