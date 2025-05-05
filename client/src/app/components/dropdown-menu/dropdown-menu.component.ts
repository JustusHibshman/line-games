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

    maxLength = input<number>(11);
    size = input<string>("medium");
    color = input<string>("B");

    hidden = signal<string>("hidden");

    madeChoice = output<string>();

    filteredOptions = computed(() => this.filterOptions(this.text(), this.options()));

    focused(): void {
        this.hidden.set("");
    }

    unFocused(): void {
        let filtOp: Array<string> = this.filteredOptions();
        if (filtOp.length == 1) {
            this.makeChoice(filtOp[0]);
        }
        this.hideDropdown();
    }

    makeChoice(choice: string) {
        this.text.set(choice);
        this.madeChoice.emit(choice);
        this.hideDropdown();
    }

    filterOptions(text: string, options: Array<string>): Array<string> {
        text = text.toLowerCase();
        let result: Array<string> = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].toLowerCase().includes(text)) {
                result.push(options[i])
            }
        }
        result = result.sort((a, b) => this.stringComp(a, b));
        return result;
    }

    stringComp(a: string, b: string): number {
        let aLow = a.toLowerCase();
        let bLow = b.toLowerCase();
        if (aLow < bLow) {
            return -1;
        } else if (aLow > bLow) {
            return 1;
        } else if (a < b) {
            return -1;
        } else if (a > b) {
            return -1;
        }
        return 0;
    }

    hideDropdown(): void {
        // We need a slight delay. Otherwise the focus disappears BEFORE the click event can complete.
        setTimeout(this.hideDropdownHelper, 100, this);
    }

    hideDropdownHelper(context: DropdownMenuComponent): void {
        context.hidden.set("hidden");
    }
}
