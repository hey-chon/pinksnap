import * as React from 'react';

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground border border-primary-border',
  destructive: 'bg-destructive text-destructive-foreground shadow-sm border-destructive-border',
  outline: 'border [border-color:var(--button-outline)] shadow-xs active:shadow-none',
  secondary: 'border bg-secondary text-secondary-foreground border-secondary-border',
  ghost: 'border border-transparent',
  link: 'text-primary underline-offset-4 hover:underline',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'min-h-9 px-4 py-2',
  sm: 'min-h-8 rounded-md px-3 text-xs',
  lg: 'min-h-10 rounded-md px-8',
  icon: 'h-9 w-9',
};

const baseStyles =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2';

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: ButtonVariantProps = {}): string {
  const vClass = (variant && variantStyles[variant]) || variantStyles.default;
  const sClass = (size && sizeStyles[size]) || sizeStyles.default;
  return [baseStyles, vClass, sClass, className].filter(Boolean).join(' ');
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const combinedClassName = buttonVariants({ variant, size, className });

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: [combinedClassName, child.props.className].filter(Boolean).join(' '),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
