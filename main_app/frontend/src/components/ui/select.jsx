import { Select as ChakraSelect } from '@chakra-ui/react'
import { forwardRef } from 'react'

export const SelectRoot = forwardRef(function SelectRoot(props, ref) {
    return <ChakraSelect.Root ref={ref} {...props} />
})

export const SelectTrigger = forwardRef(function SelectTrigger(props, ref) {
    return <ChakraSelect.Trigger ref={ref} {...props} />
})

export const SelectValueText = forwardRef(function SelectValueText(props, ref) {
    return <ChakraSelect.ValueText ref={ref} {...props} />
})

export const SelectContent = forwardRef(function SelectContent(props, ref) {
    return <ChakraSelect.Content ref={ref} {...props} />
})

export const SelectItem = forwardRef(function SelectItem(props, ref) {
    return <ChakraSelect.Item ref={ref} {...props} />
})
