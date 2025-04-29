import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-box',
  imports: [FormsModule],
  templateUrl: './text-box.component.html',
  styleUrl: './text-box.component.scss'
})
export class TextBoxComponent {
    maxLength = input<number>(20);
    text = model<string>();
    expanding = input<boolean>(false);
    small = input<boolean>(false);

    smallStr = computed(() => this.small() ? "small" : "");

    measureText(t: string | undefined): number {
        if (t === undefined) {
            return 0;
        }
        let canvas = <HTMLCanvasElement> document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        if (ctx === null) {
            return 0;
        }
        if (this.small()) {
            ctx.font = "18px Arial";
        } else {
            ctx.font = "24px Arial";
        }
        /* The "."'s assure that any whitespace at the front and back of t is measured. */
        let stats = ctx.measureText("." + t + ".");
        let dots = ctx.measureText("..");
        let full = stats.actualBoundingBoxRight + stats.actualBoundingBoxLeft;
        /* The 2 is for the cursor */
        return 2 + full - (dots.actualBoundingBoxRight + dots.actualBoundingBoxLeft);
    }

    widthCalc = computed(() => this.expanding() ?
                    this.measureText(this.text()) :
                    this.measureText("@") +
                        (this.maxLength() - 1) * (this.measureText("@@") - this.measureText("@")));
}
