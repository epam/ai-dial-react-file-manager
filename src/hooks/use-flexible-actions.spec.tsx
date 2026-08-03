import { act, cleanup, render, screen } from '@testing-library/react';
import { FlexibleActionsDirection } from '@epam/ai-dial-ui-kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFlexibleActions } from './use-flexible-actions';

const actions = [
  { key: 'first', width: 25 },
  { key: 'second', width: 25 },
  { key: 'third', width: 25 },
];

let resizeCallback: ResizeObserverCallback;
let animationFrameCallback: FrameRequestCallback;

class ResizeObserverMock implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  unobserve = vi.fn();
}

interface HarnessProps {
  containerWidth: number;
  direction?: FlexibleActionsDirection;
}

const Harness = ({
  containerWidth,
  direction = FlexibleActionsDirection.Normal,
}: HarnessProps) => {
  const { visibleActions, hiddenActions, refs } = useFlexibleActions({
    actions,
    direction,
    actionsGap: 5,
    containerPadding: 0,
    moreButtonWidth: 20,
  });

  return (
    <div
      ref={refs.containerRef}
      data-width={containerWidth}
      data-testid="container"
    >
      <div ref={refs.leftSectionRef} data-width="20" />
      <div ref={refs.measureRef}>
        {actions.map((action) => (
          <button key={action.key} data-width={action.width}>
            {action.key}
          </button>
        ))}
      </div>
      <div ref={refs.rightSectionRef} data-width="20" />
      <output data-testid="visible">
        {visibleActions.map(({ key }) => key).join(',')}
      </output>
      <output data-testid="hidden">
        {hiddenActions.map(({ key }) => key).join(',')}
      </output>
    </div>
  );
};

describe('useFlexibleActions', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        animationFrameCallback = callback;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    vi.spyOn(
      HTMLElement.prototype,
      'getBoundingClientRect',
    ).mockImplementation(function (this: HTMLElement) {
      const width = Number(this.dataset.width ?? 0);
      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: width,
        top: 0,
        width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });

    vi.spyOn(
      HTMLElement.prototype,
      'offsetWidth',
      'get',
    ).mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset.width ?? 0);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('keeps leading actions visible in normal direction', () => {
    render(<Harness containerWidth={130} />);

    expect(screen.getByTestId('visible')).toHaveTextContent('first,second');
    expect(screen.getByTestId('hidden')).toHaveTextContent('third');
  });

  it('keeps trailing actions visible in reverse direction', () => {
    render(
      <Harness
        containerWidth={130}
        direction={FlexibleActionsDirection.Reverse}
      />,
    );

    expect(screen.getByTestId('visible')).toHaveTextContent('second,third');
    expect(screen.getByTestId('hidden')).toHaveTextContent('first');
  });

  it('recalculates the visible actions when the container is resized', () => {
    const { rerender } = render(<Harness containerWidth={130} />);

    rerender(<Harness containerWidth={100} />);
    act(() => {
      resizeCallback([], {} as ResizeObserver);
      animationFrameCallback(0);
    });

    expect(screen.getByTestId('visible')).toHaveTextContent('first');
    expect(screen.getByTestId('hidden')).toHaveTextContent('second,third');
  });
});
