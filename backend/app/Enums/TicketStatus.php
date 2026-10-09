<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'abierto';
    case Derived = 'derivado';
    case InProgress = 'en_curso';
    case Resolved = 'resuelto';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Abierto',
            self::Derived => 'Derivado',
            self::InProgress => 'En curso',
            self::Resolved => 'Resuelto',
        };
    }
}
