import { Button } from '@cred/neopop-web/lib/components';
import { X } from 'lucide-react';

interface CloseButtonProps {
  onClick: () => void;
  variant?: 'modal' | 'inline' | 'transparent';
  className?: string;
  style?: React.CSSProperties;
}

export function CloseButton({
  onClick,
  variant = 'inline',
  className,
  style,
}: CloseButtonProps) {
  const size = variant === 'transparent' ? 16 : variant === 'modal' ? 18 : 14;

  const baseStyle: React.CSSProperties =
    variant === 'transparent'
      ? { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', padding: 4 }
      : {  minWidth: 'auto' };

  return (
    <Button
      variant="secondary"
      kind="elevated"
      size="small"
      colorMode="dark"
      onClick={onClick}
      className={className}
      style={{ ...baseStyle, ...style }}
    >
      <X size={size} />
    </Button>
  );
}
