import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sorted'
})
export class SortedPipe implements PipeTransform {

    transform<T, S>(a: Array<T>, keyFn?: (obj: T) => S): Array<T> {
        if (a.length == 0) {
            return [];
        }

        if (keyFn === undefined) {
            if (this.isStringArray(a)) {
                return a.sort(this.stringComp);
            }
            return a.sort(this.anyComp<T>);
        }

        if (this.isStringOutputter<T>(keyFn, a)) {
            let f: (x: T) => string = keyFn;  // Making this explicit is needed for the compiler
            return a.sort((x: T, y: T) => this.stringComp(f(x), f(y)));
        }
        return a.sort((x: T, y: T) => this.anyComp<S>(keyFn(x), keyFn(y)));
    }

    isStringArray(a: Array<any>): a is Array<string> {
        for (let x of a) {
            if (typeof x != "string") {
                return false;
            }
        }
        return true;
    }

    // Returns true iff f outputs a string on all the elements of tArr
    isStringOutputter<T>(f: (x: T) => any, tArr: Array<T>): f is (x: T) => string {
        for (let x of tArr) {
            if (typeof f(x) != "string") {
                return false;
            }
        }
        return true;
    }

    stringComp(x: string, y: string): number {
        let xLow = x.toLowerCase();
        let yLow = y.toLowerCase();
        if (xLow < yLow) {
            return -1;
        } else if (xLow > yLow) {
            return 1;
        } else if (x < y) {
            return -1;
        } else if (x > y) {
            return -1;
        }
        return 0;
    }

    anyComp<T>(x: T, y: T): number {
        if (x < y) {
            return -1;
        } else if (x > y) {
            return 1;
        }
        return 0;
    }
}
