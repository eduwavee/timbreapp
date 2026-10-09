<?php

namespace App\Enums;

enum AdjustmentType: string
{
    case Icl = 'icl';
    case Ipc = 'ipc';
    case Fixed = 'fijo';

    public function label(): string
    {
        return match ($this) {
            self::Icl => 'ICL',
            self::Ipc => 'IPC',
            self::Fixed => 'Monto fijo',
        };
    }
}
