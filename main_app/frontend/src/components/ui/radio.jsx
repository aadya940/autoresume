import { Box } from '@chakra-ui/react'
import { forwardRef, createContext, useContext, useId } from 'react'

const RadioGroupContext = createContext()

export const RadioGroup = forwardRef(function RadioGroup(props, ref) {
    const { value, onValueChange, children, ...rest } = props
    const groupId = useId()

    return (
        <RadioGroupContext.Provider value={{ groupValue: String(value || ''), onValueChange, groupId }}>
            <Box ref={ref} role="radiogroup" display="flex" gap={4} {...rest}>
                {children}
            </Box>
        </RadioGroupContext.Provider>
    )
})

export const Radio = forwardRef(function Radio(props, ref) {
    const { children, value, ...rest } = props
    const context = useContext(RadioGroupContext)

    if (!context) {
        console.error('Radio must be used within RadioGroup')
        return null
    }

    const stringValue = String(value)
    const isChecked = context.groupValue === stringValue

    const handleChange = (e) => {
        if (context.onValueChange) {
            // Pass the value directly, not wrapped in an object
            context.onValueChange(e.target.value)
        }
    }

    return (
        <Box as="label" display="inline-flex" alignItems="center" gap={2} cursor="pointer">
            <input
                ref={ref}
                type="radio"
                name={context.groupId}
                value={stringValue}
                checked={isChecked}
                onChange={handleChange}
                style={{
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    accentColor: '#3182CE',
                    margin: 0
                }}
                {...rest}
            />
            <Box as="span">{children}</Box>
        </Box>
    )
})
