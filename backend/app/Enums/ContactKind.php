<?php

namespace App\Enums;

enum ContactKind: string
{
    case Reminder = 'recordatorio';
    case Derivation = 'derivacion';

    public function label(): string
    {
        return match ($this) {
            self::Reminder => 'Recordatorio',
            self::Derivation => 'Derivación',
        };
    }
}
