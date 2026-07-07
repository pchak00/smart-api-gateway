import React, {
  CSSProperties,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  wrapperClassName?: string;
  tooltipClassName: string;
  disabled?: boolean;
  resetKey?: React.Key | boolean | null;
}

const cx = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(' ');

const VIEWPORT_PADDING = 8;

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  wrapperClassName = 'relative inline-flex',
  tooltipClassName,
  disabled = false,
  resetKey
}) => {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);
  const pointerActivatedRef = useRef(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const child = React.Children.only(children);
  const childProps = child.props as { 'aria-describedby'?: string };
  const describedBy = cx(childProps['aria-describedby'], isOpen && !disabled && tooltipId);
  const canUsePortal = typeof document !== 'undefined';

  const close = () => {
    setIsOpen(false);
    setTooltipPosition(null);
  };

  const updateTooltipPosition = useCallback(() => {
    if (!isOpen || disabled || !wrapperRef.current || !tooltipRef.current) return;

    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width;
    const tooltipHeight = tooltipRect.height;
    const placesBesideTrigger = tooltipClassName.includes('left-full');
    const alignsRight = tooltipClassName.includes('right-0');
    const sideGap = tooltipClassName.includes('ml-3') ? 12 : 8;
    const blockGap = tooltipClassName.includes('mt-2') ? 8 : 6;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = alignsRight
      ? triggerRect.right - tooltipWidth
      : triggerRect.left;
    let top = triggerRect.bottom + blockGap;

    if (placesBesideTrigger) {
      left = triggerRect.right + sideGap;
      top = triggerRect.top + ((triggerRect.height - tooltipHeight) / 2);
    } else if (top + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
      const flippedTop = triggerRect.top - blockGap - tooltipHeight;
      if (flippedTop >= VIEWPORT_PADDING) {
        top = flippedTop;
      }
    }

    left = Math.min(
      Math.max(left, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, viewportWidth - tooltipWidth - VIEWPORT_PADDING)
    );
    top = Math.min(
      Math.max(top, VIEWPORT_PADDING),
      Math.max(VIEWPORT_PADDING, viewportHeight - tooltipHeight - VIEWPORT_PADDING)
    );

    setTooltipPosition({ left, top });
  }, [disabled, isOpen, tooltipClassName]);

  useEffect(() => {
    close();
    pointerActivatedRef.current = false;
  }, [disabled, resetKey]);

  useLayoutEffect(() => {
    updateTooltipPosition();
  }, [updateTooltipPosition]);

  useEffect(() => {
    if (!isOpen || disabled) return undefined;

    window.addEventListener('resize', updateTooltipPosition);
    window.addEventListener('scroll', updateTooltipPosition, true);

    return () => {
      window.removeEventListener('resize', updateTooltipPosition);
      window.removeEventListener('scroll', updateTooltipPosition, true);
    };
  }, [disabled, isOpen, updateTooltipPosition]);

  useEffect(() => {
    const handleWindowBlur = () => close();

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    left: tooltipPosition?.left ?? 0,
    top: tooltipPosition?.top ?? 0,
    right: 'auto',
    bottom: 'auto',
    transform: 'none',
    visibility: tooltipPosition ? 'visible' : 'hidden',
    zIndex: 'var(--pacific-z-tooltip)'
  };
  const tooltipElement = isOpen && !disabled ? (
    <span
      id={tooltipId}
      ref={tooltipRef}
      role="tooltip"
      className={tooltipClassName}
      style={tooltipStyle}
    >
      {content}
    </span>
  ) : null;

  return (
    <span
      ref={wrapperRef}
      className={wrapperClassName}
      onPointerEnter={() => {
        if (!disabled) setIsOpen(true);
      }}
      onPointerLeave={() => {
        pointerActivatedRef.current = false;
        close();
      }}
      onPointerDown={() => {
        pointerActivatedRef.current = true;
        close();
      }}
      onClick={close}
      onFocus={() => {
        if (!disabled && !pointerActivatedRef.current) {
          setIsOpen(true);
        }
      }}
      onBlur={() => {
        pointerActivatedRef.current = false;
        close();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          close();
        }
      }}
    >
      {React.cloneElement(children, {
        'aria-describedby': describedBy || undefined
      })}
      {tooltipElement && canUsePortal ? createPortal(tooltipElement, document.body) : tooltipElement}
    </span>
  );
};
