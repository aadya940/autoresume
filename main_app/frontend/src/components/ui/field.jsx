import { Field as ChakraField } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const Field = forwardRef(function Field(props, ref) {
    const { label, children, ...rest } = props
    return (
        <ChakraField.Root ref={ref} {...rest}>
            {label && <ChakraField.Label>{label}</ChakraField.Label>}
            {children}
        </ChakraField.Root>
    )
})
