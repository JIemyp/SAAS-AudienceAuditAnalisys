import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

interface FormFieldProps {
    name: string;
    label: string;
    helperText?: string;
    placeholder?: string;
    type?: "text" | "textarea" | "select";
    required?: boolean;
    options?: { value: string; label: string }[];
    className?: string;
}

export function FormField({
    name,
    label,
    helperText,
    placeholder,
    type = "text",
    required = false,
    options,
    className,
}: FormFieldProps) {
    const {
        register,
        formState: { errors },
    } = useFormContext();

    const error = errors[name];

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-error ml-1">*</span>}
            </Label>

            {helperText && (
                <p className="text-xs text-text-secondary">{helperText}</p>
            )}

            {type === "textarea" ? (
                <Textarea
                    id={name}
                    placeholder={placeholder}
                    error={!!error}
                    {...register(name)}
                />
            ) : type === "select" ? (
                <Select id={name} error={!!error} {...register(name)}>
                    <option value="">Select...</option>
                    {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            ) : (
                <Input
                    id={name}
                    type="text"
                    placeholder={placeholder}
                    error={!!error}
                    {...register(name)}
                />
            )}

            {error && (
                <p className="text-xs text-error">{error.message as string}</p>
            )}
        </div>
    );
}
