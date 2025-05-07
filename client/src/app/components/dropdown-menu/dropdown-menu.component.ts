import { Component, computed, input, output, signal } from '@angular/core';

import { TextBoxComponent } from '@local-components/text-box/text-box.component';

@Component({
  selector: 'app-dropdown-menu',
  imports: [TextBoxComponent],
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.scss'
})
export class DropdownMenuComponent {

    options = input.required<Array<string>>();
    text = signal<string>("");
    filteredOptions = computed(() => this.options().filter(this.containsFn(this.text())));

    maxLength = input<number>(15);
    size = input<string>("medium");
    color = input<string>("B");

    hidden = signal<string>("hidden");

    madeChoice = output<string>();

    focused(): void {
        this.hidden.set("");
    }

    unFocused(): void {
        if (this.filteredOptions().length == 1) {
            this.makeChoice(this.filteredOptions()[0]);
        } else {
            this.hideDropdown();
        }
    }

    makeChoice(choice: string) {
        this.text.set(choice);
        this.madeChoice.emit(choice);
        this.hideDropdown();
    }

    hideDropdown(): void {
        // We need a slight delay. Otherwise the focus disappears BEFORE the click event can complete.
        setTimeout(this.hideDropdownHelper, 100, this);
    }

    hideDropdownHelper(context: DropdownMenuComponent): void {
        context.hidden.set("hidden");
    }

    containsFn(subString: string): (s: string) => boolean {
        let lowerSubString = subString.toLowerCase();
        return (s: string) => s.toLowerCase().includes(lowerSubString);
    }
}
