import { Component, inject, signal } from '@angular/core';

import { ActionButtonComponent } from '@local-components/action-button/action-button.component';
import { HelpHoverBoxComponent } from '@local-components/help-hover-box/help-hover-box.component';
import { IntegerInputComponent } from '@local-components/integer-input/integer-input.component';
import { NavButtonComponent } from '@local-components/nav-button/nav-button.component';
import { TextBoxComponent } from '@local-components/text-box/text-box.component';
import { ToggleSwitchComponent } from '@local-components/toggle-switch/toggle-switch.component';

import { GameSpec, copyGameSpec }   from '@local-types/game-spec.type';

import { SortedPipe } from '@local-pipes/sorted.pipe';

import { RulePresetsService } from '@local-services/rule-presets.service';

@Component({
  selector: 'app-design',
  imports: [ActionButtonComponent, HelpHoverBoxComponent, IntegerInputComponent,
            NavButtonComponent, TextBoxComponent, ToggleSwitchComponent,
            SortedPipe],
  templateUrl: './design.component.html',
  styleUrl: './design.component.scss'
})
export class DesignComponent {
    presets = inject(RulePresetsService);
    configName = signal<string>("");

    gameSpec: GameSpec = this.presets.ticTacToeConfig();
    specs: { [id: string]: GameSpec } = this.presets.getSpecs();
    specNames: Array<string> = this.presets.getSpecNames();

    saveConfigAsPreset(): void {
        this.presets.saveConfigAsPreset(this.configName(), this.gameSpec);
        this.specs = this.presets.getSpecs();
        this.specNames = this.presets.getSpecNames();
    }

    loadConfig(name: string): void {
        if (this.specs[name]) {
            this.gameSpec = this.specs[name];
        }
    }

    resetConfigs(): void {
        this.presets.resetConfigs();
        this.specs = this.presets.getSpecs();
        this.specNames = this.presets.getSpecNames();
    }
}
