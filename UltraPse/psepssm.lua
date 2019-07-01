--[[
	/****************************************************************************
	 * psepssm.lua - Copyright 2017 Pu-Feng Du, Ph.D.                        *
	 *                                                                          *
	 * This file is a part of the software: UltraPse                            *
	 * UltraPse is free software: you can redistribute it and/or modify         *
	 * it under the terms of the GNU General Public License as published by     *
	 * the Free Software Foundation, either version 3 of the License, or        *
	 * (at your option) any later version.                                      *
	 *                                                                          *
	 * UltraPse is distributed in the hope that it will be useful,              *
	 * but WITHOUT ANY WARRANTY; without even the implied warranty of           *
	 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            *
	 * GNU General Public License for more details.                             *
	 *                                                                          *
	 * You should have received a copy of the GNU General Public License        *
	 * along with UltraPse.  If not, see <http://www.gnu.org/licenses/>.        *
	 ****************************************************************************/

	 Legacy scripts from PseAAC-General
--]]

--[[
	This scripts was updated on Oct. 9th, 2017.
	Add some lines to make it compatible with UltraPse.
	Most contents are identical to those in PseAAC-General.
	The usage of the script is identical to PseAAC-General.
	This scripts provide the following modes:
		PsePSSM 

	Make sure the database and psiblast are propertly configured before executing this script.
--]]

--[[
    PsePSSM mode of general pseudo-amino acid composition

    This script implements the PsePSSM using Embedded Lua Script.
    Dependency : Sequence DB for searching and PSI-BLAST in system path
    Writting priviedge is required.
--]]

--These are global settings
aaTypeCount = 20

--These options can be overwritten on the command line using -n option
if not db_file_prefix then
db_file_prefix = "uniprot"
end
if not iter_cnt then
iter_cnt = 3
end
if not e_cutoff then
e_cutoff = 0.001
end

--The maximal delay parameter, this can be set by command line option -l of pseaac-builder
--g_options = psebGetOptions()
--g_delay = g_options.l

g_options = nil
g_delay = nil

AddModule("PSEB3")
SetNotation("STDPROT")

function pseb3_length()
	if not g_options then
		g_options = psebGetOptions()
		g_delay = g_options.l
	end
	return aaTypeCount*2
end

--Interface to the PSEB
function pseb3_seq_proc (pr_id, pr_seq)
    PSSM(pr_id,pr_seq)
    local x = ParsePSSM(pr_id..".pssm")
    local z = PsePSSM(x,g_delay)
    os.remove(pr_id..".pssm")
	return aaTypeCount*2, z
end

--Execute PSI-BLAST for PSSM
function PSSM(id,seq)
    --Prepare the sequence temporary file
    tmpFile = os.tmpname()
	--print(tmpFile)
	tmpFile = "."..tmpFile.."fas"
    print(tmpFile)
	tmpFH = io.open(tmpFile,"w")
	--tmpFH = io.tmpfile()
        tmpFH:write(">"..id.."\n")
        tmpFH:write(seq.."\n")
    tmpFH:close()
    --Call PSI-BLAST
    os.execute("psiblast -query "..tmpFile.." -db "..db_file_prefix.." -out "..id..".out -num_iterations "..iter_cnt.." -evalue "..e_cutoff.." -out_ascii_pssm "..id..".pssm")
    --CleanUp
    os.remove(tmpFile)
    os.remove(id..".out")
end

--Compute PsePSSM according to Nuc-PLoc, t is a pssm
function PsePSSM(t, delay)
    --Init result space
    local tmpR = {}
    for i =1, aaTypeCount*2 do
        tmpR[i]=0
    end

    --Compute the average part
    for i = 1, t.Count do
        local vt = t[i]
        for j = 1, aaTypeCount do
            tmpR[j] = tmpR[j] + vt[j]
        end
    end
    for j = 1, aaTypeCount do
        tmpR[j] = tmpR[j] / t.Count
    end

    --Compute the PsePSSM part, using delay
    local seq_len = t.Count
    for i = 1, seq_len - delay do
        local vt1 = t[i]
        local vt2 = t[i+delay]
        for j = 1, aaTypeCount do
            tmpR[j+aaTypeCount] = tmpR[j+aaTypeCount] + (vt1[j] - vt2[j])^2
        end
    end
    for j = 1, aaTypeCount do
        tmpR[j+aaTypeCount] = tmpR[j+aaTypeCount] / (seq_len -delay)
    end

    return tmpR
end

--Normalize the PSSM from pssm file
function NormalizePSSM(t)
    for i = 1,pssmTable.Count do
        local vt = pssmTable[i]
        local sum = 0
        local sumsquare = 0
        local vn = vt.Count
        for j = 1, vn do
            sum = sum + vt[j]
            sumsquare = sumsquare + vt[j]^2
        end
        local meanval = sum / vn
        local stdvar = (sumsquare/vn -(meanval)^2)^0.5
        for j = 1, vn do
            vt[j] = (vt[j] - meanval) / stdvar
        end
    end
end

--Read from pssm file to construct the pssm datatable
--[[
    pssm table structure
    pssm-table
        Count = i
        aao
            [1] = c
            [2] = c
            ...
            [20] = c
        [1]=pssmline-table
            index = i
            aaSym = c
            [1] = d
            [2] = d
            ...
            [20] = d
            Count  = i
        [2]=pssmline-table
        ...
        [Count]=pssmline-table

--]]
function ParsePSSM(pssmFilename)
    pssmfh = io.open(pssmFilename)
    local alltext = pssmfh:read("*all")
    pssmfh:close()
    local aaorderpat = "%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+%a%s+"
    local linepat = "%d+%s+%a%s+[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*[+-]?%d+%s*"
    local aaOrder = GetAAOrderTable(string.match(alltext,aaorderpat))
    local pssmTable = {}
    pssmTable["aao"] = aaOrder
    local cnt = 0
    for w in string.gmatch(alltext,linepat) do
        local tmpPssmLine = ParsePSSMLine(w)
        pssmTable[tonumber(tmpPssmLine.index)] = tmpPssmLine
        cnt = cnt + 1
    end
    pssmTable["Count"] = cnt
    return pssmTable
end

function GetAAOrderTable(l)
    local tmpR = {}
    for c in string.gmatch(l,"%a") do
        tmpR[#tmpR+1] = c
    end
    return tmpR
end

function ParsePSSMLine(l)
    local tmpR = {}
    tmpR["index"] = tonumber(string.match(l,"%d+"))
    tmpR["aaSym"] = string.match(l,"%a")
    local sym_s,sym_e = string.find(l,"%a")
    l = string.sub(l,sym_e + 1, string.len(l))
    local i = 1
    for c in string.gmatch(l,"[+-]?%d+") do
        tmpR[i] = tonumber(c)
        i = i+1
    end
    tmpR["Count"] = i - 1
    return tmpR
end
