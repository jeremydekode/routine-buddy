
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';

const tutorialSteps = [
    {
        icon: 'fa-hands-holding-child',
        title: 'Welcome to Routine Buddy!',
        text: 'Let\'s take a quick tour to help you and your little one get started on building great habits together.',
    },
    {
        icon: 'fa-list-check',
        title: 'Daily Routines',
        text: 'This is the main screen for your child. They can see their tasks for the morning, afternoon, and bedtime, and check them off as they go!',
    },
    {
        icon: 'fa-star',
        title: 'Earn Stars & Rewards',
        text: 'Completing tasks and entire routines earns stars. Collect enough stars to complete weekly and monthly quests for fun rewards!',
    },
    {
        icon: 'fa-user-tie',
        title: 'The Parent Zone',
        text: 'Tap the button on the top-left to enter the Parent Zone. Here, you can customize routines, approve rewards, and view progress.',
    },
    {
        icon: 'fa-rocket',
        title: 'You\'re All Set!',
        text: 'You\'re ready to start building positive routines. Enjoy the journey with your little buddy!',
    }
];

export const OnboardingTutorial: React.FC = () => {
    const { dispatch } = useAppContext();
    const [step, setStep] = React.useState(0);

    const handleNext = () => {
        if (step < tutorialSteps.length - 1) {
            setStep(s => s + 1);
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };

    const handleClose = () => {
        dispatch({ type: 'COMPLETE_ONBOARDING' });
    };

    const currentStep = tutorialSteps[step];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center transform transition-all duration-300 scale-100">
                <div className="flex justify-end">
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                         <i className="fa-solid fa-times w-6 h-6"></i>
                    </button>
                </div>

                <div className="text-purple-500 bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <i className={`fa-solid ${currentStep.icon} text-4xl`}></i>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentStep.title}</h2>
                <p className="text-slate-500 mb-8 min-h-[72px]">{currentStep.text}</p>
                
                <div className="flex justify-center items-center gap-2 mb-8">
                    {tutorialSteps.map((_, index) => (
                        <div key={index} className={`w-2 h-2 rounded-full transition-colors ${step === index ? 'bg-purple-500' : 'bg-slate-200'}`}></div>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={step === 0}
                        className="font-bold text-slate-500 px-4 py-3 rounded-lg hover:bg-slate-100 transition disabled:opacity-0 disabled:pointer-events-none"
                    >
                        Back
                    </button>

                    {step < tutorialSteps.length - 1 ? (
                         <button onClick={handleNext} className="flex-1 font-bold text-white bg-purple-500 px-4 py-3 rounded-lg hover:bg-purple-600 transition shadow-md">
                            Next
                        </button>
                    ) : (
                         <button onClick={handleClose} className="flex-1 font-bold text-white bg-green-500 px-4 py-3 rounded-lg hover:bg-green-600 transition shadow-md">
                            Get Started!
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
