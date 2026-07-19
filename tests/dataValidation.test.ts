import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidBrazilianPhone, isValidCnpj, isValidCpf, isValidEmail, normalizeEmail, samePersonKey } from '../src/lib/dataValidation.ts'

test('valida e normaliza e-mails', () => {
  assert.equal(isValidEmail('cliente@empresa.com.br'), true)
  assert.equal(isValidEmail('cliente@'), false)
  assert.equal(normalizeEmail(' CLIENTE@EMPRESA.COM '), 'cliente@empresa.com')
})

test('valida telefones brasileiros', () => {
  assert.equal(isValidBrazilianPhone('(11) 99999-9999'), true)
  assert.equal(isValidBrazilianPhone('119999'), false)
})

test('valida CPF e CNPJ conhecidos para teste', () => {
  assert.equal(isValidCpf('529.982.247-25'), true)
  assert.equal(isValidCpf('111.111.111-11'), false)
  assert.equal(isValidCnpj('04.252.011/0001-10'), true)
  assert.equal(isValidCnpj('00.000.000/0000-00'), false)
})

test('normaliza identidade para detectar duplicidade', () => {
  assert.equal(samePersonKey(' João  Silva ', ' Empresa Ágil '), samePersonKey('joão silva', 'empresa ágil'))
})
