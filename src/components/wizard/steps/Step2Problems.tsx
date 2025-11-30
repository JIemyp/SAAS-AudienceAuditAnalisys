import { FormField } from "../FormField";

export function Step2Problems() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Problems & Value</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    What problems do you solve and what value do you provide?
                </p>
            </div>

            <FormField
                name="problems"
                label="Problems Your Product Solves"
                type="textarea"
                placeholder="Bloating after meals, low energy in the morning, poor digestion, gut discomfort"
                helperText="List 3-5 specific problems your customers face. These will be used to identify pain points and triggers. Be concrete — 'bloating after meals' is better than 'digestive issues'."
                required
            />

            <FormField
                name="benefits"
                label="Benefits Customer Gets"
                type="textarea"
                placeholder="Better gut health in 2 weeks, more energy, reduced bloating, improved mood"
                helperText="List the main benefits your customers receive from using your product."
                required
            />

            <FormField
                name="usp"
                label="Why Choose You Over Alternatives (USP)"
                type="textarea"
                placeholder="Only frozen format = live bacteria survive. Clean label, no fillers. Whole food based, not synthetic."
                helperText="What makes your product uniquely different from competitors?"
                required
            />
        </div>
    );
}
