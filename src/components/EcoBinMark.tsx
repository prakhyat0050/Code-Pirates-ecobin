interface EcoBinMarkProps {
    className?: string;
}

export default function EcoBinMark({ className = '' }: EcoBinMarkProps) {
    return (
        <img
            src={`${import.meta.env.BASE_URL}ecobin-mark.svg`}
            alt=""
            aria-hidden="true"
            className={className}
        />
    );
}
