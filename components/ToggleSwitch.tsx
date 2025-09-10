import React from 'react';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    description?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, description }) => {
    const id = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div>
            <div className="flex items-center justify-between">
                <label htmlFor={id} className="font-medium text-slate-700 cursor-pointer">
                    {label}
                </label>
                <button
                    id={id}
                    role="switch"
                    aria-checked={checked}
                    onClick={() => onChange(!checked)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                        checked ? 'bg-purple-500' : 'bg-slate-300'
                    }`}
                >
                    <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            checked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                </button>
            </div>
            {description && (
                <p className="text-xs text-slate-400 mt-1 pr-12">{description}</p>
            )}
        </div>
    );
};