<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/** Un valor oficial: ICL diario del BCRA o IPC mensual del INDEC (fecha = primer día del mes). */
#[Fillable(['index', 'date', 'value'])]
class IndexValue extends Model
{
    protected function casts(): array
    {
        return ['date' => 'date', 'value' => 'decimal:6'];
    }
}
