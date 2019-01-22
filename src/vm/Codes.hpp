#pragma once

#include "types.hpp"

namespace Vortex {
  enum CodeClass: byte {
    SPECIAL,
    TOP_TYPE,
    TERNARY_OPERATOR,
    BINARY_OPERATOR,
    UNARY_OPERATOR,
    SCOPE,
    CONTROL,
  };

  enum Code: byte {
    // SPECIAL
    END,
    PROGRAM,
    GFUNC,
    MFUNC,
    INVALID,
    DUP,
    SWAP,
    ASSERT,
    LOG_INFO,
    LOCATION,

    // TOP_TYPE
    NULL_,
    BOOL,

    UINT8,
    UINT16,
    UINT32,
    UINT64,

    INT8,
    INT16,
    INT32,
    INT64,

    FLOAT8,
    FLOAT16,
    FLOAT32,
    FLOAT64,

    STRING,
    ARRAY,
    OBJECT,
    VSET,
    FUNC,

    // TERNARY_OPERATOR
    UPDATE,
    INSERT,

    // BINARY_OPERATOR
    EQUAL,
    NOT_EQUAL,
    AND,
    OR,

    LESS,
    GREATER,
    LESS_EQ,
    GREATER_EQ,

    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,
    MODULUS,
    POWER,

    LEFT_SHIFT,
    RIGHT_SHIFT,

    INTERSECT,
    EX_UNION,
    UNION,

    CONCAT,
    PUSH_BACK,
    PUSH_FRONT,

    AT,
    HAS_INDEX,

    BIND,
    METHOD_LOOKUP,

    // UNARY_OPERATOR
    NEGATE,
    BIT_NEGATE,
    NOT,
    INC,
    DEC,
    LENGTH,

    // SCOPE
    GET,
    SET,

    // CONTROL
    GCALL,
    MCALL,
    CALL,
    RETURN,
    EMIT,
    IF,
    ELSE,
    LOOP,
    BREAK,
    CONTINUE,
  };

  CodeClass GetClass(Code code);
}
