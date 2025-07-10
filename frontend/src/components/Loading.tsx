import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 24,
    className,
}) => {
    return (
        <div
            className={cn(
                "inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary",
                className
            )}
            style={{ width: size, height: size }}
            role="status"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default LoadingSpinner;