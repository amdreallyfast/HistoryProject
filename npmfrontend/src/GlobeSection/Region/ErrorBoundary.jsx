import { Component } from "react"

// Shallow per-element comparison of two resetKeys arrays (Object.is semantics).
// undefined/missing arrays compare equal so a boundary without resetKeys never
// auto-resets.
const resetKeysChanged = (prev, next) => {
  if (prev === next) {
    return false
  }
  if (!prev || !next || prev.length !== next.length) {
    return true
  }
  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) {
      return true
    }
  }
  return false
}

// Generic React error boundary. Catches errors thrown during render, commit, and
// effects (useEffect / useLayoutEffect) of its subtree. It does NOT catch errors
// in event handlers or in the react-three-fiber useFrame loop (those run outside
// React's render/commit cycle).
//
// Used inside <Canvas> to keep one malformed region (e.g. a clockwise-wound
// boundary that makes EarClipping throw) from unwinding to the React root and
// blanking the whole app. The offending subtree renders `fallback` (default null
// = nothing) while everything else keeps working.
//
// Props:
//   children   - the subtree to protect
//   fallback   - rendered in place of children after an error (default null)
//   onError    - called with (error, info) when an error is caught (logging hook)
//   resetKeys  - array; when any element changes (shallow), a tripped boundary
//                clears its error and re-attempts children. Lets a region that
//                failed once recover after its boundary data is edited.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && resetKeysChanged(prevProps.resetKeys, this.props.resetKeys)) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}
