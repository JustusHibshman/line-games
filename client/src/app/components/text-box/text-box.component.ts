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
    size = input<string>("medium");
    color = input<string>("B");

    measureText(t: string | undefined): number {
        if (t === undefined) {
            return 0;
        }
        let canvas = <HTMLCanvasElement> document.getElementById("canvas");
        let ctx = canvas.getContext("2d");
        if (ctx === null) {
            return 0;
        }
        if (this.size() == "small") {
            ctx.font = "14px Arial";
        } else if (this.size() == "medium") {
            ctx.font = "18px Arial";
        } else if (this.size() == "large") {
            ctx.font = "24px Arial";
        } else {
            ctx.font = "36px Arial";
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
