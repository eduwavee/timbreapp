<?php

namespace App\Enums;

enum Trade: string
{
    case Plumbing = 'plomeria';
    case Electrical = 'electricidad';
    case Gas = 'gas';
    case Locksmith = 'cerrajeria';
    case Painting = 'pintura';
    case Masonry = 'albanileria';
    case General = 'general';

    public function label(): string
    {
        return match ($this) {
            self::Plumbing => 'Plomería',
            self::Electrical => 'Electricidad',
            self::Gas => 'Gas',
            self::Locksmith => 'Cerrajería',
            self::Painting => 'Pintura',
            self::Masonry => 'Albañilería',
            self::General => 'General',
        };
    }
}
