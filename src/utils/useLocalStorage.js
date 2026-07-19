import { useState, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  // Store both the key and the value in state
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return { key, value: item ? JSON.parse(item) : initialValue };
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return { key, value: initialValue };
    }
  });

  // Tracks the latest value synchronously so back-to-back setValue calls
  // (e.g. two functional updates in the same handler) each see the previous
  // call's result, instead of both reading the stale value from this render.
  const valueRef = useRef(state.value);
  valueRef.current = state.value;

  // Sync state if the key changes (React pattern for derived state)
  let currentValue = state.value;
  if (key !== state.key) {
    try {
      const item = window.localStorage.getItem(key);
      currentValue = item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      currentValue = initialValue;
    }
    valueRef.current = currentValue;
    // Update state during render to trigger an immediate re-render
    setState({ key, value: currentValue });
  }

  // Only write to localStorage when explicitly updating the value
  const setValue = (newValue) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(valueRef.current) : newValue;
      valueRef.current = valueToStore;
      setState({ key, value: valueToStore });
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [currentValue, setValue];
}
