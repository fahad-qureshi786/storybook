import React, { MouseEvent, PureComponent, ReactNode } from 'react';

import { navigate, hrefTo } from '../../utils';

// FIXME: copied from Typography.Link. Code is duplicated to
// avoid emotion dependency which breaks React 15.x back-compat

// Cmd/Ctrl/Shift/Alt + Click should trigger default browser behaviour. Same applies to non-left clicks
const LEFT_BUTTON = 0;

const isPlainLeftClick = (e: MouseEvent<HTMLAnchorElement>) =>
  e.button === LEFT_BUTTON && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey;

const cancelled = (e: MouseEvent<HTMLAnchorElement>, cb = (_e: any) => {}) => {
  if (isPlainLeftClick(e)) {
    e.preventDefault();
    cb(e);
  }
};

interface Props {
  kind: string | null;
  story: string | null;
  children: ReactNode;
}

interface State {
  href: string;
}

export default class LinkTo extends PureComponent<Props, State> {
  static defaultProps: Props = {
    kind: null,
    story: null,
    children: undefined,
  };

  state: State = {
    href: '/',
  };

  componentDidMount() {
    this.updateHref();
  }

  componentDidUpdate(prevProps: Props) {
    const { kind, story } = this.props;

    if (prevProps.kind !== kind || prevProps.story !== story) {
      this.updateHref();
    }
  }

  updateHref = async () => {
    const { kind, story } = this.props;
    if (kind && story) {
      const href = await hrefTo(kind, story);
      this.setState({ href });
    }
  };

  handleClick = () => {
    const { kind, story } = this.props;
    if (kind && story) {
      navigate({ kind, story });
    }
  };

  render() {
    const { kind, story, children, ...rest } = this.props;
    const { href } = this.state;

    return (
      <a href={href} onClick={(e) => cancelled(e, this.handleClick)} {...rest}>
        {children}
      </a>
    );
  }
}
