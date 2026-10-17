import { Component } from 'react';

// Wraps one card so that if it ever fails, only that card disappears. The rest of Home keeps working.
export default class Safe extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('[Home] a card failed and was hidden:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
