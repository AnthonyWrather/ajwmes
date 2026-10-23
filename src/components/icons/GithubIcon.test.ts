import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { GithubIcon, Github, GithubIconProps } from './GithubIcon';

describe('GithubIcon', () => {
  it('renders default SVG props when no arguments are provided', () => {
    const element = GithubIcon({});
    assert.ok(React.isValidElement<GithubIconProps>(element));
    assert.equal(element.type, 'svg');
    assert.equal(element.props.width, 24);
    assert.equal(element.props.height, 24);
    assert.equal(element.props.viewBox, '0 0 24 24');
    assert.equal(element.props.fill, 'none');
    assert.equal(element.props.stroke, 'currentColor');
    assert.equal(element.props.strokeWidth, 2);
  });

  it('accepts custom size and className props', () => {
    const element = GithubIcon({ size: 14, className: 'w-3.5 h-3.5', 'aria-label': 'GitHub' });
    assert.ok(React.isValidElement<GithubIconProps>(element));
    assert.equal(element.props.width, 14);
    assert.equal(element.props.height, 14);
    assert.equal(element.props.className, 'w-3.5 h-3.5');
    assert.equal(element.props['aria-label'], 'GitHub');
  });

  it('exports Github alias identical to GithubIcon', () => {
    assert.equal(Github, GithubIcon);
  });
});
