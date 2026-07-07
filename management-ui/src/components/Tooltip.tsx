import React, { ReactElement, ReactNode, useEffect, useId, useRef, useState } from 'react';

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
  const pointerActivatedRef = useRef(false);
  const child = React.Children.only(children);
  const childProps = child.props as { 'aria-describedby'?: string };
  const describedBy = cx(childProps['aria-describedby'], isOpen && !disabled && tooltipId);

  const close = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    close();
    pointerActivatedRef.current = false;
  }, [disabled, resetKey]);

  useEffect(() => {
    const handleWindowBlur = () => close();

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  return (
    <span
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
      {isOpen && !disabled && (
        <span id={tooltipId} role="tooltip" className={tooltipClassName}>
          {content}
        </span>
      )}
    </span>
  );
};
