<?php

namespace App\Enums;

enum ContractStatus: string
{
    case Active = 'vigente';
    case Finished = 'finalizado';
    case Terminated = 'rescindido';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Vigente',
            self::Finished => 'Finalizado',
            self::Terminated => 'Rescindido',
        };
    }
}
