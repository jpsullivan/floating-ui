import {isSignal, signal} from '@angular/core';
import {describe, expect, test} from 'vitest';
import {signalProxy} from './signal-proxy';

describe('signalProxy', () => {
  const inputSignal = signal({fn: () => 'bar', baz: 'qux'});
  const proxy = signalProxy(inputSignal);

  test('should have computed fields', () => {
    expect(proxy.baz()).toEqual('qux');
    expect(isSignal(proxy.baz)).toBe(true);
  });

  test('should pass through functions as-is', () => {
    expect(proxy.fn()).toEqual('bar');
    expect(isSignal(proxy.fn)).toBe(false);
  });

  test('supports "in" operator', () => {
    expect('baz' in proxy).toBe(true);
    expect('foo' in proxy).toBe(false);
  });

  test('supports "Object.keys"', () => {
    expect(Object.keys(proxy)).toEqual(['fn', 'baz']);
  });

  test('reactively updates when input signal changes', () => {
    const reactiveSignal = signal({value: 'initial'});
    const reactiveProxy = signalProxy(reactiveSignal);

    expect(reactiveProxy.value()).toBe('initial');

    reactiveSignal.set({value: 'updated'});
    expect(reactiveProxy.value()).toBe('updated');
  });

  test('handles null/undefined values', () => {
    const nullSignal = signal({nullValue: null, undefinedValue: undefined});
    const nullProxy = signalProxy(nullSignal);

    expect(nullProxy.nullValue()).toBe(null);
    expect(nullProxy.undefinedValue()).toBe(undefined);
  });
});
