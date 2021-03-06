import { Operator } from '../../core/operator';
import { Subscriber } from '../../core/subscriber';
import { Observable } from '../../core/observable';
import { OperatorFunction } from '../../core/types';

export function map<T, R>(project: (value: T, index: number) => R, thisArg?: any): OperatorFunction<T, R> {
  return function mapOperation(source: Observable<T>): Observable<R> {
    if (typeof project !== 'function') {
      throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
    }
    return source.lift(new MapOperator(project, thisArg));
  };
}

export class MapOperator<T, R> implements Operator<T, R> {
  constructor(private project: (value: T, index: number) => R, private thisArg: any) {
  }

  call(subscriber: Subscriber<R>, source: any): any {
    return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
  }
}

/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
class MapSubscriber<T, R> extends Subscriber<T> {
  count: number = 0;
  private thisArg: any;

  constructor(destination: Subscriber<R>,
              private project: (value: T, index: number) => R,
              thisArg: any) {
    super(destination);
    this.thisArg = thisArg || this;
  }

  // NOTE: This looks unoptimized, but it's actually purposefully NOT
  // using try/catch optimizations.
  protected _next(value: T) {
    let result: R;
    try {
      result = this.project.call(this.thisArg, value, this.count++);
    } catch (err) {
      if (this.destination.error) this.destination.error(err);
      return;
    }
    if (this.destination.next) this.destination.next(result);
  }
}
