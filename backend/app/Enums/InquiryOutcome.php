<?php

namespace App\Enums;

enum InquiryOutcome: string
{
    case Won = 'concretada';
    case Lost = 'descartada';

    public function label(): string
    {
        return match ($this) {
            self::Won => 'Se concretó',
            self::Lost => 'No avanzó',
        };
    }
}
