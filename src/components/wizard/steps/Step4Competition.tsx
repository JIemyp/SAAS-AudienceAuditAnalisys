import { FormField } from "../FormField";

export function Step4Competition() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Competition & Positioning</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    Help us understand your competitive landscape.
                </p>
            </div>

            <FormField
                name="competitors"
                label="Key Competitors"
                type="textarea"
                placeholder="AG1 (Athletic Greens), Seed (probiotics), Bloom Nutrition, Ka'Chava"
                helperText="List 2-5 brands your potential customers might consider instead of you. Include both direct and indirect competitors."
                required
            />

            <FormField
                name="differentiation"
                label="What Makes You Different"
                type="textarea"
                placeholder="Whole food based (not powder), frozen (not shelf-stable), microalgae (not synthetic vitamins), transparent sourcing"
                helperText="Explain how you differentiate from the competitors you listed above."
                required
            />
        </div>
    );
}
